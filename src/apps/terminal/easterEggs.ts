import { ok, type CommandHandler } from "./types";

const fortunes = [
  "There are only two hard things in computing: cache invalidation, naming things, and off-by-one errors.",
  "The best error message is the one that tells you what to do next.",
  "It works on my machine. Fortunately, this machine is now your browser.",
  "A Finnish debugging session: coffee, silence, one more log line.",
  "Behind every reliable backend is someone who read the logs.",
  "You can exit the terminal. The terminal aesthetic stays with you.",
  "If the bug has six legs, try opening the ant game.",
];

export function cow(message: string) {
  const rows = message
    .trim()
    .slice(0, 800)
    .match(/.{1,42}(?:\s|$)|.{1,42}/gu) ?? ["Moo."];
  const width = Math.max(...rows.map((line) => [...line.trim()].length));
  const speech = rows
    .map(
      (line, i) =>
        `${rows.length === 1 ? "<" : i === 0 ? "/" : i === rows.length - 1 ? "\\" : "|"} ${line.trim().padEnd(width)} ${rows.length === 1 ? ">" : i === 0 ? "\\" : i === rows.length - 1 ? "/" : "|"}`,
    )
    .join("\n");
  return ` ${"_".repeat(width + 2)}\n${speech}\n ${"-".repeat(width + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||\n`;
}

export const easterEggs: Record<string, CommandHandler> = {
  fortune: () =>
    ok(`${fortunes[Math.floor(Math.random() * fortunes.length)]}\n`),
  cowsay: (args, stdin) =>
    ok(cow(args.join(" ") || stdin || "Welcome to suuronen.dev.")),
  coffee: () =>
    ok(
      "       ( (\n        ) )\n      ........\n      |      |]   kahvitauko\n      \\      /    Coffee break. The bugs can wait.\n       `----'\n\nTip: fortune | cowsay pairs nicely with this.\n",
    ),
  sl: () =>
    ok(
      "      ====        ________                ___________\n  _D _|  |_______/        \\__I_I_____===__|_________|\n   |(_)---  |   H\\________/ |   |        =|___ ___|\n   /     |  |   H  |  |     |   |         ||_| |_||\n  |      |  |   H  |__--------------------| [___] |\n  | ________|___H__/__|_____/[][]~\\_______|       |\n  |/ |   |-----------I_____I [][] []  D   |=======|__\n__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__\n |/-=|___|=    ||    ||    ||    |_____/~\\___/\n  \\_/      \\O=====O=====O=====O_/      \\_/\n\nNext stop: ls.\n",
    ),
  apt: (args) =>
    args.join(" ") === "moo"
      ? ok(cow("Have you mooed today?"))
      : {
          stdout: "",
          stderr:
            "apt: package installation is unavailable in this browser shell. Try apt moo.\n",
          code: 100,
        },
  sudo: (args) =>
    args.join(" ") === "make me a sandwich"
      ? ok(
          "Okay.\n\n   _____________\n  /____________/\\\n  |  sandwich  |/\n  '------------'\n\nPrivilege escalation: lunch edition.\n",
        )
      : {
          stdout: "",
          stderr:
            "sudo: emil is not in the sudoers file. This incident will be reported to the rubber duck.\n",
          code: 1,
        },
  xyzzy: () =>
    ok(
      "A hollow voice says: 'Try adventure. There is a world behind this prompt.'\n",
    ),
  "42": () =>
    ok(
      "The answer to life, the universe, and everything.\nThe question is still compiling.\n",
    ),
  ants: () =>
    ok("Opening the live bug tracker. Bring a swatter.\n", [
      { type: "open", target: "antgame" },
    ]),
  adventure: (args, _stdin, context) => {
    const game = context.adventure;
    const action = args.join(" ").toLowerCase() || "look";
    const rooms: Record<string, string> = {
      desk: "THE DESK\nA terminal glows in the dark. A rubber duck guards the keyboard.\nA cold cup of coffee sits beside it. The server room is north.\nThe kitchen is east.\n",
      kitchen:
        "THE KITCHEN\nThe coffee machine hums reassuringly. A sign says 'use mug'.\nThe desk is west.\n",
      server: game.won
        ? "THE SERVER ROOM\nSilence. The fans are purring. The ants are on their lunch break.\nThe desk is south.\n"
        : "THE SERVER ROOM\nThe fans are roaring. A colony of ants is compiling the kernel.\nTheir queen looks exhausted. Maybe a coffee would help.\nThe desk is south.\n",
    };
    if (action === "reset") {
      context.adventure = { room: "desk", inventory: [], won: false };
      return ok("A fresh boot.\n" + rooms.desk);
    }
    if (action === "look") return ok(rooms[game.room]);
    if (["inventory", "i"].includes(action))
      return ok(`You carry: ${game.inventory.join(", ") || "nothing"}.\n`);
    const direction = action.replace(/^go /, "");
    const routes: Record<string, Record<string, string>> = {
      desk: { north: "server", east: "kitchen" },
      kitchen: { west: "desk" },
      server: { south: "desk" },
    };
    if (Object.prototype.hasOwnProperty.call(routes[game.room], direction)) {
      game.room = routes[game.room][direction];
      return ok(rooms[game.room]);
    }
    if (action === "take mug" && game.room === "desk") {
      if (game.inventory.includes("mug") || game.inventory.includes("coffee"))
        return ok("You already have the mug.\n");
      game.inventory.push("mug");
      return ok("You pick up the mug. A promising start.\n");
    }
    if (action === "take duck" && game.room === "desk") {
      if (!game.inventory.includes("duck")) game.inventory.push("duck");
      return ok("The duck joins your debugging team.\n");
    }
    if (action === "use duck" && game.inventory.includes("duck"))
      return ok(
        "You explain the problem to the duck.\nIt says nothing. You realize you should take the mug to the kitchen.\n",
      );
    if (
      action === "use mug" &&
      game.room === "kitchen" &&
      game.inventory.includes("mug")
    ) {
      game.inventory = game.inventory.map((item) =>
        item === "mug" ? "coffee" : item,
      );
      return ok(
        "The machine fills your mug. It smells like a successful deployment.\n",
      );
    }
    if (
      action === "use coffee" &&
      game.room === "server" &&
      game.inventory.includes("coffee")
    ) {
      game.won = true;
      game.inventory = game.inventory.filter((item) => item !== "coffee");
      return ok(
        "The queen takes a sip. 'Finally. A developer who understands.'\nThe colony rolls back its kernel patch. The fans settle.\n\nQUEST COMPLETE: Production is quiet.\nYour reward: `ants` opens their considerably less quiet day job.\n",
      );
    }
    return ok(
      "Nothing happens. Try look, north/south/east/west, take mug, take duck,\nuse ITEM, inventory, or reset.\n",
    );
  },
};
