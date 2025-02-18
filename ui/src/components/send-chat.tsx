"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import User from "@/type/user";

const formSchema = z.object({
  userMessage: z.string().min(1, {
    message: "Username must be at least 1 characters.",
  }),
});

export function SendChatForm({
  user,
  chatWith,
  socket,
}: {
  user: User;
  chatWith: User;
  socket: Socket;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userMessage: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const message = {
      sender: {
        id: socket.id,
        name: user.name,
        message: values.userMessage,
      },
      recepient: {
        id: chatWith.id,
        name: chatWith.id,
      },
    };

    socket.emit("sendMessage", message);

    form.setValue("userMessage", "");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-fit items-center p-4"
      >
        <FormField
          control={form.control}
          name="userMessage"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="sr-only">Send a Message</FormLabel>
              <FormControl>
                <Input
                  placeholder="Send a Message"
                  className="m-0 border-none bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="ghost"
          className="size-10 rounded-full hover:bg-neutral-800 hover:text-neutral-200"
        >
          <Send />
        </Button>
      </form>
    </Form>
  );
}
