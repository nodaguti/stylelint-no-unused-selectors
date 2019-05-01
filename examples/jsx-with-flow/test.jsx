// @flow
import React from 'react';

type Item = {
  href: String,
  name: string,
};

type Props = {
  list: Item[],
};

export const Test = ({ list }: Props) => {
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
