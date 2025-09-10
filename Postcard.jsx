import React from "react";

function PostCard({ user, content, image }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
      {image && <img src={image} alt="Post" className="w-full h-56 object-cover" />}
      <div className="p-4">
        <h3 className="font-bold text-pitch mb-2">{user}</h3>
        <p className="text-gray-600">{content}</p>
        <div className="flex justify-between mt-4 text-sm text-gray-500">
          <button className="hover:text-blue-500">❤️ Approve</button>
          <button className="hover:text-green-400">💬 Comment</button>
          <button className="hover:text-blue-500">🔁 Share</button>
        </div>
      </div>
    </div>
  );
}

export default PostCard;
