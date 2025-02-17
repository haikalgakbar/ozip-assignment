"use client";

import { LoginForm } from "@/components/login";
import { useState } from "react";
import io, { Socket } from "socket.io-client";
import User from "@/type/user";
import { Button } from "@/components/ui/button";

const socket = io("http://localhost:8000");

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("welcome", (msg) => {
  console.log(msg);
});

export default function Home() {
  const [user, setUser] = useState<User>({ userName: "", displayName: "" });
  const [chatList, setChatList] = useState<User[] | []>([]);

  socket.on(
    "updateUsers",
    (userList: { userName: string; displayName: string }[]) => {
      setChatList(userList);
    },
  );

  console.log(chatList);

  if (!user.userName || !user.displayName) {
    return (
      <main className="flex h-dvh w-dvw items-center justify-center bg-neutral-950">
        <section className="rounded-xl bg-neutral-900 p-4">
          <LoginForm setUser={setUser} socket={socket} />
        </section>
      </main>
    );
  }

  return (
    <main className="grid h-dvh w-dvw grid-cols-12 items-center justify-center bg-neutral-950 p-2">
      <aside className="col-span-2 flex h-full flex-col pe-2">
        <ul className="flex-1 text-neutral-100">
          {chatList
            .filter((chat) => chat.userName != user.userName)
            .map((chat) => (
              <li className="rounded-xl bg-neutral-800 p-4" key={chat.userName}>
                <h2>
                  {chat.displayName} @{chat.userName}
                </h2>
                <p>Message</p>
              </li>
            ))}
        </ul>
        <section className="flex w-full items-center border-t border-t-neutral-700 pt-2 text-neutral-100">
          <article className="w-full">
            <h2>{user.displayName}</h2>
            <h2>@{user.userName}</h2>
          </article>
          <Button>Logout</Button>
        </section>
      </aside>
      <section className="col-span-10 h-full rounded-xl bg-neutral-800 p-4">
        <h1>Syudah login pack</h1>
      </section>
    </main>
  );
}
