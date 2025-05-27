import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  textSize?: string;
  withLink?: boolean;
}

const Logo: React.FC<LogoProps> = ({ textSize = 'text-4xl', withLink = true }) => {
  const content = (
    <div className="flex items-center">
      <span className={`text-brasil-green font-dancing ${textSize} font-bold mr-2`}>Opa</span>
      <span className={`text-brasil-yellow font-dancing ${parseInt(textSize.replace('text-', '')) - 1}xl font-bold`}>que delícia!</span>
    </div>
  );

  if (withLink) {
    return <Link href="/" className="hover:opacity-90 transition-opacity">{content}</Link>;
  }

  return content;
};

export default Logo;
