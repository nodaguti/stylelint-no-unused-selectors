// @flow
import React from 'react';

type Item = {
  href: string,
  name: string,
};

type Props = {
  list: Item[],
};

export const Test = ({ list }: Props) => {
  return (
    <>
      <div className="plain" />
      <div className="space-separated-1 space-separated-2" />
      <ul>
        {list.map((item) => (
          <li className="in-array" />
        ))}
      </ul>
      <div
        className={classNames('classnames', {
          'classnames-conditinal': true,
        })}
      />
    </>
  );
};
