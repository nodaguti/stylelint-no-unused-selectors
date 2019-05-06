import React from 'react';
// @ts-ignore
import classNames from 'classnames';

interface Item {
  href: string;
  name: string;
  isNewStyle: boolean;
}

interface Props {
  list: Item[];
}

export const Test: React.FunctionComponent<Props> = ({ list }) => {
  return (
    <ul className="list">
      {list.map((item) => (
        <li className="list-item list-item-2">
          <a
            href={item.href}
            className={classNames('list-link', {
              'list-link-new': item.isNewStyle,
            })}
          >
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  );
};
