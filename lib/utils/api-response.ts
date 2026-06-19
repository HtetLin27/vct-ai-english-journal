import { NextResponse } from "next/server"

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data, error: null },
    { status }
  )
}

export function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, data: null, error: message },
    { status }
  )
}

export const jsonValidation = (message: string) => jsonError(message, 400)
export const jsonUnauthorized = () => jsonError("Unauthorized", 401)
export const jsonNotFound = (message: string) => jsonError(message, 404)
export const jsonInternal = () => jsonError("Internal server error", 500)
