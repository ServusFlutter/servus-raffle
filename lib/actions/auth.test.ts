/**
 * @jest-environment node
 */
import { signOut } from "./auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Mock Supabase client
jest.mock("@/lib/supabase/server");
jest.mock("next/cache");

describe("signOut", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        signOut: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it("should successfully sign out user", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    // Act
    const result = await signOut();

    // Assert
    expect(result).toEqual({ data: null, error: null });
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("should return error when Supabase signOut fails", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: { message: "Session expired" },
    });

    // Act
    const result = await signOut();

    // Assert
    expect(result).toEqual({ data: null, error: "Failed to sign out" });
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors gracefully", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockRejectedValue(
      new Error("Network error")
    );

    // Act
    const result = await signOut();

    // Assert
    expect(result).toEqual({ data: null, error: "Failed to sign out" });
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate paths only on successful signout", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    // Act
    await signOut();

    // Assert
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });
});
