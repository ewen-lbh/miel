import gmail from "@googleapis/gmail"
import { GraphQLError } from "graphql"
import { jwtDecode } from "jwt-decode"
import { builder, prisma } from "../builder.js"
import { RedirectionError } from "../lib/auth.js"
import { AccountType, URLType } from "../schema.js"
import { fieldName } from "../utils.js"

enum OauthHost {
  Google,
}

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: AccountType,
    errors: {
      types: [RedirectionError],
    },
    description:
      "Initiate or finish a OAuth2 authorization flow to get a token for the server.",
    args: {
      code: t.arg.string({
        required: false,
        description:
          "The authorization code from the OAuth2 provider. Set it to finish the connection. Leave it empty to initiate an authorization flow. If left empty, the mutation returns the URL to redirect to.",
      }),
      host: t.arg({
        type: builder.enumType(OauthHost, {
          name: "OauthHost",
          description: "The OAuth host to use",
        }),
      }),
      callback: t.arg({
        type: URLType,
        description: "The URL to redirect to after authorization",
        required: true,
      }),
    },
    async resolve(query, _, { code, callback, host }, { ensuredUserId }) {
      switch (host) {
        case OauthHost.Google:
          const client = new gmail.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            callback
          )

          if (!code) {
            throw new RedirectionError(
              new URL(
                client.generateAuthUrl({
                  access_type: "offline",
                  scope: [
                    "https://mail.google.com",
                    "openid",
                    "https://www.googleapis.com/auth/userinfo.email",
                  ],
                  redirect_uri: callback,
                  // redirect_uri: enforceNonNull(
                  //   callback,
                  //   "callback url required when no code given"
                  // ),
                })
              )
            )
          }

          const { tokens } = await client.getToken(code)
          const { access_token, refresh_token, id_token } = tokens
          if (!id_token) throw new GraphQLError("No id_token received")
          const { email } = jwtDecode(id_token) as { email: string }

          if (!email) throw new GraphQLError("No email received")

          let account = await prisma.account.findUnique({
            where: { address: email, userId: ensuredUserId() },
          })

          const receiverAuth = await prisma.serverAuth.create({
            data: {
              username: email,
              token: access_token,
              password: refresh_token,
            },
          })

          if (!account) {
            const receiverServer = await prisma.server.create({
              data: {
                host: "gmail.com",
                port: 993,
                type: "Google",
                secure: true,
                username: email,
              },
            })
            account = await prisma.account.create({
              data: {
                address: email,
                name: email,
                userId: ensuredUserId(),
                receiverServerId: receiverServer.id,
                receiverAuthId: receiverAuth.id,
                senderAuthId: receiverAuth.id,
                senderServerId: receiverServer.id,
              },
            })
          } else {
            await prisma.account.update({
              where: { address: email, userId: ensuredUserId() },
              data: {
                receiverAuth: {
                  update: {
                    token: access_token,
                    password: refresh_token,
                  },
                },
                senderAuth: {
                  update: {
                    token: access_token,
                    password: refresh_token,
                  },
                },
              },
            })
          }

          return prisma.account.findUniqueOrThrow({
            ...query,
            where: { address: email, userId: ensuredUserId() },
          })

        default:
          throw new GraphQLError("Unsupported server type")
      }
    },
  })
)
