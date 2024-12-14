import { builder, prisma } from "../builder.js"
import { backchannelCallNoResponse } from "../lib/backchannel.js"
import { AccountType, EmailAddressType } from "../schema.js"
import { enforceNonNull, fieldName } from "../utils.js"

const ServerInput = builder.inputType("ServerInput", {
  fields: (t) => ({
    username: t.string({ required: false }),
    host: t.string({ required: false }),
    port: t.int({ defaultValue: 993, required: true }),
    tls: t.boolean({ defaultValue: true, required: true }),
    password: t.string({ required: false }),
  }),
})

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: AccountType,
    errors: {},
    args: {
      address: t.arg({ required: true, type: EmailAddressType }),
      input: t.arg({
        required: true,
        type: builder.inputType("AccountInput", {
          fields: (t) => ({
            name: t.string({ required: false }),
            sender: t.field({
              required: false,
              type: ServerInput,
            }),
            receiver: t.field({
              required: true,
              type: ServerInput,
            }),
          }),
        }),
      }),
    },
    async resolve(
      query,
      _,
      { address, input: { name, receiver, sender } },
      ctx
    ) {
      const result = await prisma.account.upsert({
        ...query,
        where: { address, userId: ctx.ensuredUserId() },
        update: {
          name: name ?? undefined,
          receiverServer: {
            update: {
              host: receiver.host ?? undefined,
              port: receiver.port ?? undefined,
              secure: receiver.tls ?? undefined,
              username: receiver.username ?? undefined,
              password: receiver.password ?? undefined,
            },
          },
          receiverAuth: {
            update: {
              username: receiver.username ?? undefined,
              password: receiver.password ?? undefined,
            },
          },
          senderServer: {
            update: {
              host: sender?.host ?? undefined,
              port: sender?.port ?? undefined,
              secure: sender?.tls ?? undefined,
              username: sender?.username ?? undefined,
              password: sender?.password ?? undefined,
            },
          },
          senderAuth: sender
            ? {
                update: {
                  username: sender.username ?? undefined,
                  password: sender.password ?? undefined,
                },
              }
            : undefined,
        },
        create: {
          address,
          user: { connect: { id: ctx.ensuredUserId() } },
          name: enforceNonNull(name, "the account name"),
          receiverAuth: {
            create: {
              username: enforceNonNull(
                receiver.username ?? address,
                "receiver username"
              ),
              password: enforceNonNull(receiver.password, "receiver password"),
            },
          },
          senderAuth: sender
            ? {
                create: {
                  username: enforceNonNull(
                    sender.username ?? address,
                    "sender username"
                  ),
                  password: enforceNonNull(sender.password, "sender password"),
                },
              }
            : undefined,
          receiverServer: {
            create: {
              type: "IMAP",
              host: enforceNonNull(receiver.host, "receiver host"),
              port: receiver.port,
              secure: receiver.tls,
              username: enforceNonNull(
                receiver.username ?? address,
                "receiver username"
              ),
            },
          },
          senderServer: sender
            ? {
                create: {
                  type: "SMTP",
                  host: enforceNonNull(sender.host, "sender host"),
                  port: sender.port,
                  secure: sender.tls,
                  username: enforceNonNull(
                    sender.username ?? address,
                    "sender username"
                  ),
                },
              }
            : undefined,
        },
      })

      backchannelCallNoResponse(result.id, { ResyncAll: true })
      return result
    },
  })
)
