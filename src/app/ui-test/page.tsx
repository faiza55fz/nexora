"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";

export default function UItestPage() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="p-8 space-y-6 bg-bg text-ink min-h-screen">
      <h1 className="text-2xl font-bold">UI Primitive Test Page</h1>
      <Card header={<h2 className="text-ink font-semibold">Card Header</h2>}>Hello Card</Card>
      <Button variant="cta" onClick={() => setOpen(true)}>
        Open Modal
      </Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
      <Button variant="secondary" loading>
        Loading
      </Button>
      <Input label="Email" placeholder="you@example.com" />
      <Textarea label="Message" placeholder="Your comment..." rows={3} />
      <Select label="Sort by" defaultValue="price">
        <option value="price">Price</option>
        <option value="pop">Popularity</option>
      </Select>
      <Badge variant="success">Success</Badge>
      <Skeleton width="w-48" height="h-6" rounded="rounded-xl" />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Test Modal">
        <p>This is a modal content.</p>
      </Modal>
    </div>
  );
}
