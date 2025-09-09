import { Server, Socket } from "./../imports";
import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      io?: Server;
      user: User;
      socket: Socket;
    }
  }
}
