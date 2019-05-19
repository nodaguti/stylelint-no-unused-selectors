import React from 'react';
import classNames from 'classnames';

export const Test = ({ list }) => {
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
