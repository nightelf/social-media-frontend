"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { apiPost } from "@/lib/api";
import { postSchema, type PostValues } from "@/lib/schemas";
import type { Post } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { TextAreaField, SubmitButton } from "@/components/common/fields";

export function PostComposer({ onCreated }: { onCreated: (post: Post) => void }) {
  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { body: "" },
  });

  const onSubmit = async (values: PostValues) => {
    try {
      const post = await apiPost<Post>("/posts", values);
      onCreated(post);
      form.reset({ body: "" });
      toast.success("Posted!");
    } catch {
      toast.error("Could not create post");
    }
  };

  return (
    <Card>
      <CardContent className="py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <TextAreaField control={form.control} name="body" label="What's happening?" placeholder="Share something…" />
            <div className="flex justify-end">
              <SubmitButton loading={form.formState.isSubmitting}>Post</SubmitButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
