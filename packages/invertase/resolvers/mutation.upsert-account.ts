import { builder, prisma } from "../builder"
import { AccountType, EmailAddressType } from "../schema"
import { enforceNonNull, fieldName } from "../utils"

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
            username: t.string({ required: false }),
            host: t.string({ required: false }),
            port: t.int({ defaultValue: 993, required: true }),
            tls: t.boolean({ defaultValue: true, required: true }),
            password: t.string({ required: false }),
          }),
        }),
      }),
    },
    async resolve(query, _, { address, input }) {
      return prisma.account.upsert({
        ...query,
        where: { address },
        update: {
          name: input.name ?? undefined,
          receiverServer: {
            update: {
              host: input.host ?? undefined,
              port: input.port ?? undefined,
              secure: input.tls ?? undefined,
              username: input.username ?? undefined,
              password: input.password ?? undefined,
            },
          },
        },
        create: {
          address,
          name: enforceNonNull(input.name),
          receiverAuth: {
            create: {
              username: enforceNonNull(input.username ?? address),
              password: enforceNonNull(input.password),
            },
          },
          receiverServer: {
            create: {
              type: "IMAP",
              host: enforceNonNull(input.host),
              port: input.port,
              secure: input.tls,
              username: enforceNonNull(input.username ?? address),
            },
          },
        },
      })
    },
  })
)
