import React from 'react';

interface Item {
  href: string;
  name: string;
}

interface Props {
  list: Item[];
}

export const Test: React.FunctionComponent<Props> = ({ list }) => {
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
