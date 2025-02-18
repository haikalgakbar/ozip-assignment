"use client";

import { LoginForm } from "@/components/login";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import User from "@/type/user";
import { SendChatForm } from "@/components/send-chat";
import Image from "next/image";

const socket = io("http://localhost:8000");

socket.on("connect", () => {
  console.log("Connected to server");
});

type MessageHistory = {
  roomId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  message: string;
};

export default function Home() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [connectedUser, setconnectedUser] = useState<User[] | []>([]);
  const [chatWith, setChatWith] = useState<User | undefined>();
  const [messageHistory, setMessageHistory] = useState<MessageHistory[] | []>(
    [],
  );

  function handleChatWith(user: User) {
    setChatWith(user);
    const roomName = [socket.id, user.id].sort().join("-");
    socket.emit("joinRoom", roomName);
  }

  useEffect(() => {
    socket.on("connectedUser", (connectedUser: User[]) => {
      setconnectedUser(connectedUser.filter((user) => user.id !== socket.id));
    });

    socket.on("loadMessages", (history: MessageHistory[]) => {
      setMessageHistory(history); // Set the message history in the state
    });

    socket.on("newMessage", (message: MessageHistory) => {
      setMessageHistory((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!user) {
    return (
      <main className="flex h-dvh w-dvw items-center justify-center bg-neutral-950">
        <section className="w-full max-w-md rounded-xl bg-neutral-900 p-4">
          <LoginForm setUser={setUser} socket={socket} />
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh grid-cols-12 bg-neutral-950">
      <aside className="col-span-2 flex h-dvh flex-col overflow-auto p-2 pe-0">
        <ul className="flex flex-col gap-2 text-neutral-100">
          {connectedUser.map((chat) => (
            <li
              className="w-full rounded-xl bg-neutral-800 p-4"
              key={chat.id}
              onClick={() => handleChatWith(chat)}
            >
              <h2>{chat.name}</h2>
              <p>Message</p>
            </li>
          ))}
        </ul>
      </aside>
      <section className="col-span-10 m-2 max-h-dvh rounded-xl bg-neutral-800">
        <div className="mx-auto flex h-full flex-col gap-2">
          {chatWith === undefined ? (
            <h1>Empty</h1>
          ) : (
            <>
              <header className="flex items-center gap-2 p-2">
                <div className="rounded-full bg-neutral-100 p-2">
                  <Image
                    src="/icon/iconUser.svg"
                    width={24}
                    height={24}
                    alt="User picture"
                  />
                </div>
                <h2>@{chatWith.name}</h2>
              </header>
              <ul className="flex-1 overflow-scroll">
                {messageHistory.map((message) => (
                  <article key={Math.random()} className="bg-neutral-700 p-4">
                    {message.message}
                  </article>
                ))}
              </ul>
              <SendChatForm user={user} chatWith={chatWith} socket={socket} />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
