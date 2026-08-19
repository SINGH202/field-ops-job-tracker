import { describe, expect, it } from "vitest";
import { sslForDatabaseUrl } from "../src/db/pool";

describe("sslForDatabaseUrl", () => {
  it("does not use SSL for localhost, loopback, or Docker Compose hostnames", () => {
    expect(sslForDatabaseUrl("postgres://fieldops:fieldops@localhost:5433/fieldops")).toBeUndefined();
    expect(sslForDatabaseUrl("postgres://fieldops:fieldops@127.0.0.1:5432/fieldops")).toBeUndefined();
    expect(sslForDatabaseUrl("postgres://fieldops:fieldops@postgres:5432/fieldops")).toBeUndefined();
  });

  it("uses SSL for cloud hosts such as Render", () => {
    expect(
      sslForDatabaseUrl("postgres://fieldops:fieldops@dpg-example.oregon-postgres.render.com/fieldops"),
    ).toEqual({ rejectUnauthorized: false });
  });

  it("honors sslmode on the connection string", () => {
    expect(
      sslForDatabaseUrl("postgres://fieldops:fieldops@db.example.com/fieldops?sslmode=disable"),
    ).toBeUndefined();
    expect(
      sslForDatabaseUrl("postgres://fieldops:fieldops@localhost:5433/fieldops?sslmode=require"),
    ).toEqual({ rejectUnauthorized: false });
  });
});
