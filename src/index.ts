import { getProperties } from "properties-file";
import waitOn from "wait-on";
import { Rcon } from "rcon-client";
import path from "path";
import fs from "fs";

export default (propertiesFilePath: string, timeout = 90000) => {
    const filePath = path.resolve(propertiesFilePath);

    if (!fs.existsSync(filePath)) {
        throw new Error(`The ${propertiesFilePath} file doesn't exist!`);
    }

    const fileParsed = getProperties(fs.readFileSync(filePath));

    if (!fileParsed["server-ip"]) {
        throw new Error("The server-ip property doesn't exist on the server.properties file!");
    }

    if (!fileParsed["rcon.port"]) {
        throw new Error("The rcon.port property doesn't exist on the server.properties file!");
    }

    if (!fileParsed["rcon.password"]) {
        throw new Error("The rcon.password property doesn't exist on the server.properties file!");
    }

    let rcon: Rcon | undefined = undefined;

    async function startRconConnection() {
        rcon = new Rcon({
            host: fileParsed["server-ip"],
            port: Number(fileParsed["rcon.port"]),
            password: fileParsed["rcon.password"],
        });

        await rcon
            .connect()
            .then(() => console.log("RCON connection has been established to the Minecraft server!"))
            .catch((error) => {
                console.error("Error during the RCON connection!", error);
            });

        rcon.on("end", () => {
            console.log("RCON connection has been ended!");
            console.log("Trying to reconnect...");
            setTimeout(async () => {
                await startRconConnection();
            }, 2000);
        });

        rcon.on("error", (error) => {
            console.error("Error during the RCON connection!");
            throw error;
        });
    }

    return {
        name: "grakkit-hrm",
        async configResolved() {
            try {
                console.log("Waiting for the Minecraft server to start...");
                await waitOn({
                    resources: [`tcp:${fileParsed["server-ip"]}:${fileParsed["rcon.port"]}`],
                    timeout,
                });
            } catch (error) {
                console.error("Cannot connect to the Minecraft server!");
                throw error;
            }

            await startRconConnection();
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
                    console.error("Error during the plugin reloading!", error);
                });
        },
    };
};
