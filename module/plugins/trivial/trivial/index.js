'use strict';
import Trivial from "./trivial";
import Handlers from "./handlers";
import Commands from "./ctxmenu_commands";

let commands = new Commands();
let cy = new Trivial();
new Handlers(cy);