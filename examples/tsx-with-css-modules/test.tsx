import React from 'react';
// @ts-ignore
import classNames from 'classnames';
// @ts-ignore
import styles from 'test.css';
const styles2 = require('test.css');

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
    <ul className={styles.list}>
      {list.map((item) => (
        <li
          className={classNames(styles['list-item'], {
            [styles['list-item-2']]: item.isNewStyle,
          })}
        >
          <a href={item.href} className={styles2['list-link']}>
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  );
};
