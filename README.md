# BF RCON for Deno

## Usage

```ts
const client = await Rcon.connect({ hostname: "127.0.0.1", port: 4711, password: "default" });
const maps = await client.send('exec maplist.list');
console.log(maps);
```
