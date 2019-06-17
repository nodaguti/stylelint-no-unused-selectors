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
    <>
      <div className={styles.plain} />
      <div
        className={`${styles2['space-separated-1']} ${styles2['space-separated-2']}`}
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
