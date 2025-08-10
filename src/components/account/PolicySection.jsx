import React from 'react';

const PolicySection = ({ content }) => {
    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
};

export default PolicySection;