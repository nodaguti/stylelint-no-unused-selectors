import React from 'react';
import classNames from 'classnames';
import styles from 'test.css';
const styles2 = require('test.css');

export const Test = ({ list }) => {
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
