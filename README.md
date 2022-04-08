# BF RCON for Deno

## Usage

```ts
const conn = await Rcon.connect({ hostname: "127.0.0.1", port: 4711, password: "default" });
const maps = await conn.send('exec maplist.list');
console.log(maps);
```
