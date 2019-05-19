import React from 'react';
import classNames from 'classnames';
import styles from 'test.css';
const styles2 = require('test.css');

export const Test = ({ list }) => {
  return (
    <>
      <div className={styles.plain} />
      <div
        className={`${styles2['space-separated-1']} ${
          styles2['space-separated-2']
        }`}
      />
      <ul>
        {list.map((item) => (
          <li className={styles['in-array']} />
        ))}
      </ul>
      <div
        className={classNames(styles.classnames, {
          [styles['classnames-conditinal']]: true,
        })}
      />
    </>
  );
};
