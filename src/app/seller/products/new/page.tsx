"use client";

import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";

export default function NewProduct() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Add a product" subtitle="Enter only the details customers need to buy your grocery item." />
      <Card className="space-y-5 p-6">
        <Field label="Product name"><Input placeholder="Example: Fresh Tomatoes" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category"><Select defaultValue="fruits"><option value="fruits">Fruits</option><option value="vegetables">Vegetables</option><option value="dairy">Dairy & Eggs</option><option value="staples">Rice, Atta & Grains</option><option value="pulses">Pulses</option><option value="spices">Masala & Spices</option><option value="snacks">Snacks</option><option value="beverages">Beverages</option><option value="household">Household</option></Select></Field>
          <Field label="Unit"><Select defaultValue="1 kg"><option>1 kg</option><option>500 g</option><option>250 g</option><option>1 litre</option><option>500 ml</option><option>1 pack</option><option>1 dozen</option></Select></Field>
          <Field label="Selling price (₹)"><Input type="number" placeholder="60" /></Field>
          <Field label="Available stock"><Input type="number" placeholder="50" /></Field>
        </div>
        <Field label="Short description"><Textarea placeholder="Tell customers what is special about this item..." /></Field>
        <Button size="lg" className="w-full sm:w-auto">Save product</Button>
      </Card>
    </div>
  );
}
