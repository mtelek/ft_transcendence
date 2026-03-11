export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <form className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <input
          type="email"
          placeholder="Email"
          className="px-4 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          className="px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Login
        </button>
      </form>
    </div>
  );
}
