"use client";

import { LoginForm } from "@/components/login";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import User from "@/type/user";
import { SendChatForm } from "@/components/send-chat";
import Image from "next/image";
import { useWindowSize } from "@/lib/hooks";
import { Button } from "@/components/ui/button";

import { ArrowLeft, User as UserIcon } from "lucide-react";

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
  const [chatWith, setChatWith] = useState<User | undefined>(undefined);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[] | []>(
    [],
  );
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const showChatList = !isMobile || chatWith === undefined;
  const showDetailChat = !isMobile || chatWith !== undefined;

  console.log(width);

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
      {showChatList && (
        <aside
          className={`col-span-full flex h-dvh flex-col overflow-auto p-2 transition-all duration-300 md:col-span-4 xl:col-span-3 ${!isMobile && "pe-3"}`}
        >
          {connectedUser.length ? (
            <ul className="flex flex-col gap-2 text-neutral-100">
              {connectedUser.map((chat) => (
                <li
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl p-4 hover:bg-neutral-800"
                  key={chat.id}
                  onClick={() => handleChatWith(chat)}
                >
                  <div className="w-fit rounded-full bg-neutral-600 p-2">
                    <UserIcon />
                  </div>
                  <h2 className="line-clamp-2 flex-wrap">{chat.name}</h2>
                </li>
              ))}
            </ul>
          ) : (
            <section className="flex w-full items-center gap-2 rounded-xl bg-neutral-900 p-4 text-neutral-200">
              <div className="w-fit rounded-full bg-neutral-700 p-2">
                <Image
                  src="/icon/iconWorldOff.svg"
                  width={24}
                  height={24}
                  alt=""
                  className="text-neutral-100"
                />
              </div>
              <h2>No user currently online</h2>
            </section>
          )}
        </aside>
      )}
      {showDetailChat && (
        <section
          className={`col-span-full flex max-h-dvh flex-col text-neutral-200 md:col-span-8 xl:col-span-9 ${!isMobile && "m-2"}`}
        >
          <header className="flex items-center gap-2 p-2">
            {isMobile && (
              <Button
                variant="ghost"
                onClick={() => {
                  setChatWith(undefined);
                }}
                className="size-10 rounded-full p-2 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <ArrowLeft size={24} strokeWidth={2} />
              </Button>
            )}
            <div className="rounded-full bg-neutral-800 p-2 text-neutral-400">
              <UserIcon />
            </div>
            <h2>{chatWith?.name}</h2>
          </header>
          <ul className="flex-1 overflow-y-scroll">
            {messageHistory.map((message) => (
              <article key={Math.random()} className="bg-neutral-700 p-4">
                {message.senderName}:{message.message}
              </article>
            ))}
          </ul>
          <article className="m-4 rounded-2xl bg-neutral-900">
            <SendChatForm
              user={user}
              chatWith={chatWith as User}
              socket={socket}
            />
          </article>
        </section>
      )}
    </main>
  );
}
