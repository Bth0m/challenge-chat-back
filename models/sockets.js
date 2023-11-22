const { comprobarJWT } = require("../helpers/jwt");
const {
  userConect,
  userDisconnect,
  recordMessage,
  getUsers,
} = require("../controllers");

class Sockets {
  constructor(io) {
    this.io = io;

    this.socketEvents();
  }

  socketEvents() {
    this.io.on("connection", async (socket) => {
      const [valido, uid] = comprobarJWT(socket.handshake.query["x-token"]);

      if (!valido) {
        console.log("-----------socket no identificado-------------");
        return socket.disconnect();
      }

      await userConect(uid);

      socket.join(uid);

      this.io.emit("user-list", getUsers());

      socket.on("message", async (payload) => {
        const message = await recordMessage(payload);
        this.io.to(payload.para).emit("message", message);
        this.io.to(payload.de).emit("message", message);
      });

      socket.on("disconnect", async () => {
        await userDisconnect(uid);
        this.io.emit("user-list", await getUsers());
      });
    });
  }
}

module.exports = Sockets;
