"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dispatch, SetStateAction } from "react";
import User from "@/type/user";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  displayname: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }),
});

export function LoginForm({
  setUser,
  socket,
}: {
  setUser: Dispatch<SetStateAction<User>>;
  socket: Socket;
}) {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      displayname: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    socket.on("username_error", (msg) => {});

    setUser({
      userName: values.username,
      displayName: values.displayname,
    });

    socket.emit("setUser", {
      userName: values.username,
      displayName: values.displayname,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-100">Username</FormLabel>
              <FormControl>
                <Input placeholder="stelle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayname"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-100">Display name</FormLabel>
              <FormControl>
                <Input placeholder="Manusia pentung" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="bg-neutral-800">
          Submit
        </Button>
      </form>
    </Form>
  );
}
