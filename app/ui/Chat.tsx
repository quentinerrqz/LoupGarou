import { memo, useCallback, useRef, useState } from "react";
import useQuery from "../_Hooks/useQuery";
import { IMessage, MessageRecord } from "../lib/game/schema/MessageRecord";
import { game } from "./GameProvider";
import { v4 } from "uuid";
import ChatMessage from "./ChatMessage";

const Chat = memo(function Chat() {
  const messages = useQuery<IMessage[]>("messages");

  const [open, setOpen] = useState(false);
  const toggleChat = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const handleClick = useCallback(() => {
    const input = inputRef.current;
    if (input && input.value) {
      if (!game) return;
      game?.addMessage(
        new MessageRecord({
          id: v4(),
          content: input.value,
          sender: game?.player.id,
          category: "all",
        })
      );
      input.value = "";
      setOpen(true);
    }
  }, []);

  return (
    <div className="absolute left-0 bottom-0 w-[30%] max-h-[40%] flex flex-col bg-slate-900/30 border border-white rounded-lg shadow-lg text-white">
      <div className="p-4 cursor-pointer" onClick={toggleChat}>
        <h2 className="text-lg font-bold">Chat</h2>
      </div>

      <div className={`h-64 overflow-y-auto ${open ? "block " : "hidden"} `}>
        {/* Chat messages will go here */}
        {messages && messages.length === 0 && (
          <div className="p-2 text-center">No messages yet</div>
        )}
        {messages.map((message, index) => (
          <div key={index} className="p-2 border-b border-gray-700">
            <ChatMessage message={message} />
          </div>
        ))}
      </div>
      <div className="p-4 flex items-center border-t border-gray-700">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type your message..."
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleClick}
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
});

export default Chat;
