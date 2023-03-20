import { getProperties } from "properties-file";
import { Rcon } from "rcon-client";

export default () => {
    let rcon: Rcon | undefined = undefined;
    return {
        name: "grakkit-hrm",
        async load() {
            const fileParsed = getProperties("./server/server.properties");
            rcon = new Rcon({
                host: "0.0.0.0",
                port: Number(fileParsed["rcon.port"]),
                password: fileParsed["rcon.password"],
            });
            await rcon
                .connect()
                .then(() => console.log("RCON connection has been established to the Minecraft server!"));
        },
        async writeBundle() {
            if (!rcon) {
                throw new Error("RCON connection not defined!");
            }

            rcon.send("js core.reload()")
                .then(() => {
                    console.log("The plugin has been reloaded!");
                })
                .catch((error) => {
                    console.error("Error during the plugin reloading!");
                    throw error;
                });
        },
    };
};
