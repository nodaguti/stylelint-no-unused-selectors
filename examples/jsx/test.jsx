import React from 'react';

export const Test = ({ list }) => {
  return (
    <ul className="list">
      {list.map((item) => (
        <li className="list-item list-item-2">
          <a href={item.href} className="list-link">
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  );
};
