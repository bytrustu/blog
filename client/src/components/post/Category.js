import React from 'react';
import {Link} from "react-router-dom";
import {Button, Badge} from "reactstrap";

const Category = ({posts}) => {
    return (
        <>
            {Array.isArray(posts) &&
                posts.map(({_id, categoryName, posts}) => (
                    <div key={_id} className="mx-1 mt-1 my-category">
                        <Link to={`/post/category/${categoryName}`} className="text-dark text-decoration-none">
                            <span className="ml-1">
                                <Button color="info">
                                    {categoryName}
                                    <Badge color="light" className="ml-1">{posts.length}</Badge>
                                </Button>
                            </span>
                        </Link>

                    </div>
                ))}
        </>
    )
}

export default Category;