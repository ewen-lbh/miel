import { builder } from "../builder.js";

export const DeviceType= builder.prismaNode("Device", {
    id: {field: "id"},
    fields: t => ({
        notificationsToken: t.exposeString("notificationsToken"),
    })
})
