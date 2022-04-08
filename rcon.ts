import { createHash } from "https://deno.land/std/hash/mod.ts";
import { UnexpectedResponse, AuthenticationFailed } from "./rcon_errors.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const digestRegex = /### Digest seed: (.{16})\n\n$/;
const authSuccess = 'Authentication successful, rcon ready.';

const drain = async (conn: Deno.TcpConn, buffer: Uint8Array, term: string) => {
    let message = "";
    do {
        const size = await conn.read(buffer);
        if (size === null) break;
        message += decoder.decode(buffer.subarray(0, size));
    } while (!message.endsWith(term));
    return message;
};

const stripMessage = (msg: string) => msg.endsWith(`\n\x04`)
    ? msg.substring(0, msg.length - 2)
    : msg;

class RconConnection implements Deno.Closer {
    #conn: Deno.TcpConn;
    #buffer: Uint8Array;

    constructor(conn: Deno.TcpConn, buffer: Uint8Array) {
        this.#conn = conn;
        this.#buffer = buffer;
    }

    async send(msg: string) {
        await this.#conn.write(encoder.encode(`\x02${msg}\n`));
        const response = await drain(this.#conn, this.#buffer, "\x04");
        return stripMessage(response);
    }

    close() {
        this.#conn.close();
    }
}

const Rcon = {
    async connect(options: { hostname: string, port: number, password: string, bufferSize?: number }) {
        if (options.bufferSize !== undefined && (options.bufferSize <= 0 || !Number.isInteger(options.bufferSize))) {
            throw new RangeError('Buffer size must be a positive integer');
        }

        const conn = await Deno.connect({ hostname: options.hostname, port: options.port });
        const buffer = new Uint8Array(options.bufferSize ?? 256);

        const welcomeMessage = await drain(conn, buffer, "\n\n");
        const matches = welcomeMessage.match(digestRegex);

        if (matches === null) {
            throw new UnexpectedResponse("Expected digest seed in welcome message", welcomeMessage);
        }

        const hash = createHash("md5");
        hash.update(matches[1] + options.password);

        const rconConn = new RconConnection(conn, buffer);
        const res = await rconConn.send(`login ${hash.toString()}`);

        if (res !== authSuccess) {
            throw new AuthenticationFailed(res);
        }

        return rconConn;
    }
} as const;

export default Rcon;
