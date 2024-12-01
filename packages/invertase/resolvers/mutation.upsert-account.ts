import { builder } from "../builder";
import { AccountType } from "../schema";
import { fieldName } from "../utils";

builder.mutationField(fieldName(), t => t.prismaField({
    type: AccountType,
    errors: {},
}))
