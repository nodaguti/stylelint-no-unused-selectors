import React from 'react';
// @ts-ignore
import classNames from 'classnames';

interface Item {
  href: string;
  name: string;
}

interface Props {
  list: Item[];
}

export const Test: React.FunctionComponent<Props> = ({ list }) => {
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
