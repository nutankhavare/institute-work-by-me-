import type { HttpResponseInit } from "@azure/functions";

const cors = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Content-Type": "application/json",
};

export const ok = (data: unknown, meta?: object): HttpResponseInit => ({
  status: 200,
  headers: cors,
  body: JSON.stringify({
    success: true,
    data,
    meta: meta ?? null,
    error: null,
  }),
});

export const err = (status: number, message: string): HttpResponseInit => ({
  status,
  headers: cors,
  body: JSON.stringify({ success: false, data: null, error: { message } }),
});

export const preflight = (): HttpResponseInit => ({
  status: 204,
  headers: cors,
  body: "",
});
