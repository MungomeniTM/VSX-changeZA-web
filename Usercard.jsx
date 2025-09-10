import React from "react";

function UserCard({ name, skill, location, avatar }) {
  return (
    <div className="flex items-center bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition">
      <img
        src={avatar}
        alt={name}
        className="w-14 h-14 rounded-full object-cover mr-4"
      />
      <div>
        <h3 className="font-bold text-pitch">{name}</h3>
        <p className="text-gray-600">{skill}</p>
        <p className="text-sm text-gray-500">{location}</p>
      </div>
    </div>
  );
}

export default UserCard;
