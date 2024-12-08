import { GraphQLError } from "graphql"
import * as mailer from "nodemailer"
import { builder, prisma } from "../builder"
import { AddressType, EmailAddressType, EmailType } from "../schema"
import { fieldName } from "../utils"

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: AddressType,
    errors: {},
    description: "Send an email",
    args: {
      from: t.arg({
        type: EmailAddressType,
        required: true,
        description:
          "Email address must have a connected account with a sender server configured",
      }),
      to: t.arg({ type: EmailAddressType, required: true }),
      inReply: t.arg.globalID({
        for: EmailType,
        required: false,
        description: "Reply to another email",
      }),
      subject: t.arg.string({ required: true }),
      body: t.arg.string({ required: true }),
    },
    async resolve(query, _, args) {
      const { senderAuth, senderServer, address } =
        await prisma.account.findUniqueOrThrow({
          where: { address: args.from },
          include: {
            senderServer: true,
            senderAuth: true,
          },
        })

      const inReplyTo = args.inReply
        ? await prisma.email.findUniqueOrThrow({
            where: { id: args.inReply.id },
            select: { messageId: true, inboxId: true },
          })
        : undefined

      if (inReplyTo && !inReplyTo.messageId) {
        throw new GraphQLError("Email to reply to has no Message-ID")
      }

      if (!senderServer || !senderAuth) {
        throw new GraphQLError("Sender account is not configured properly")
      }

      console.log({ senderServer })

      const transport = mailer.createTransport({
        host: senderServer.host,
        port: senderServer.port,
        secureConnection: !senderServer.secure,
        auth: {
          user: senderAuth.username,
          pass: senderAuth.password,
        },
        tls: senderServer.secure
          ? {
              ciphers: "SSLv3",
            }
          : undefined,
      })

      await transport.sendMail({
        from: address,
        to: args.to,
        subject: args.subject,
        text: args.body,
        inReplyTo: inReplyTo?.messageId ?? undefined,
      })

      await transport.sendMail({
        from: address,
        to: address,
        subject: args.subject,
        text: args.body,
        inReplyTo: inReplyTo?.messageId ?? undefined,
      })

      return prisma.address.findUniqueOrThrow({
        ...query,
        where: { address: args.to },
      })

      //   await prisma.email.create({
      //     data: {
      //       htmlBody: "",
      //       textBody: args.body,
      //       subject: envelope.subject,
      //       messageId: envelope.,
      //       sender: { connect: { address } },
      //       recipient: { connect: { address: args.to } },
      //       inbox: inReplyTo?.messageId
      //         ? { connect: { id: inReplyTo.inboxId } }
      //         : undefined,
      //     },
      //   })
    },
  })
)
