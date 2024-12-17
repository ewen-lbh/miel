import { builder } from "../builder.js";
import { DeviceType } from "../types/device.js";
import { fieldName } from "../utils.js";

builder.mutationField(fieldName(), t => t.prismaField({
    type: DeviceType,
    errors: {},
    args: {
        token: t.string()
    }
}))
