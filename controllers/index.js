const { response } = require("express");
const bcrypt = require("bcryptjs");

const { generarJWT } = require("../helpers/jwt");

let usersList = [];
let menssageList = [];

//<-------------------------- Auth -------------------------->//
const createUser = async (req, res = response) => {
  try {
    const { email, password, nombre } = req.body;

    const salt = bcrypt.genSaltSync();
    const cupassword = bcrypt.hashSync(password, salt);

    const usuario = {
      uid: `${usersList.length + 1} `,
      email,
      password: cupassword,
      nombre: nombre,
      online: false,
    };

    usersList.push(usuario);

    const token = await generarJWT(usuario.uid);

    res.json({
      ok: true,
      usuario,
      token,
    });

    console.log({ usersList });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: "Hable con el administrador",
    });
  }
};
//<------------------------------------------------------------------->//

//<--------------------------- Login -------------------------->//
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuarioDB = usersList.find((usr) => usr.email === email);
    if (!usuarioDB) {
      return res.status(404).json({
        ok: false,
        msg: "Email no encontrado",
      });
    }

    const validPassword = bcrypt.compareSync(password, usuarioDB.password);
    if (!validPassword) {
      return res.status(404).json({
        ok: false,
        msg: "Password no es correcto",
      });
    }

    const token = await generarJWT(usuarioDB.uid);

    res.json({
      ok: true,
      usuario: usuarioDB,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: "Hable con el administrador",
    });
  }
};
//<------------------------------------------------------------------->//

//<--------------------------- Renovar Token -------------------------->//
const renewToken = async (req, res) => {
  const uid = req.uid;

  const token = await generarJWT(uid);
  const usuario = usersList.find((usr) => usr.uid === uid);

  res.json({
    ok: true,
    usuario,
    token,
  });
};
//<------------------------------------------------------------------->//

//<--------------------------- Mensajes controller -------------------------->//

const getChat = async (req, res) => {
  const miId = req.uid;
  const mensajesDe = req.params.de;

  const last30 = await Mensaje.find({
    $or: [
      { de: miId, para: mensajesDe },
      { de: mensajesDe, para: miId },
    ],
  })
    .sort({ createdAt: "asc" })
    .limit(30);

  res.json({
    ok: true,
    mensajes: last30,
  });
};
//<------------------------------------------------------------------->//

//<-----------------------socket------------------>//
const userConect = async (uid) => {
  const usuario = usersList.find((usr) => usr.uid === uid);
  if (usuario) {
    usuario.online = true;
  }
  return usuario;
};
//<------------------------------------------------------------------->//

//<-----------------------userDisconnect------------------>//
const userDisconnect = async (uid) => {
  const usuario = usersList.find((usr) => usr.uid === uid);
  if (usuario) {
    usuario.online = false;
  }
  return usuario;
};
//<------------------------------------------------------------------->//

//<----------------------- Usuarios ------------------>//
const getUsers = () => usersList;
//<------------------------------------------------------------------->//

//<----------------------- Grabado Mensaje------------------>//
const recordMessage = async (payload) => {
  try {
    const currentMessage = {
      id: `${menssageList.length + 1} `,
      mensaje: payload.mensaje,
      de: payload.de,
      para: payload.para,
    };
    menssageList.push(currentMessage);
    return currentMessage;
  } catch (error) {
    console.log(error);
    return false;
  }
};
//<------------------------------------------------------------------->//

module.exports = {
  createUser,
  login,
  renewToken,
  getChat,
  userConect,
  userDisconnect,
  getUsers,
  recordMessage,
};
