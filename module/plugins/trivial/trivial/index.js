'use strict';
import Trivial from "./trivial";
import Handlers from "./handlers";
import Commands from "./ctxmenu_commands";

let cy = new Trivial();
let commands = new Commands(cy);
commands.trivial = cy;
new Handlers(cy);