import React from 'react';
import classNames from 'classnames';

export const Test = ({ list }) => {
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
