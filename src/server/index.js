'use strict';
// Import the required libraries
// import * as graphql from 'graphql';
// import * as graphqlHTTP from 'express-graphql';
// import * as express from 'express';
// import * as config from './config';
// import * as MovieDb from 'moviedb';
// import * as Promise from 'bluebird'
const graphql = require('graphql');
const graphqlHTTP = require('express-graphql');
const express = require('express');
const config = require('./config.json');
const Promise = require('bluebird');
const MovieDb = require('moviedb');


const mdb = MovieDb(config.api_key);

const multiQuery = (name) => {
    return new Promise((resolve, reject) => {
        mdb.searchMulti({query: name }, (err, res) => {
            if (err) {return reject(err)}

            resolve(res);
        });
    })
}

const TvType = new graphql.GraphQLObjectType({
    name: 'Show',
    fields: {
      backdrop_path: { type: graphql.GraphQLString },
      first_air_date: { type: graphql.GraphQLString },
      genre_ids: {type: new graphql.GraphQLList(graphql.GraphQLInt)},
      id: { type: graphql.GraphQLInt },
      original_language: { type: graphql.GraphQLString },
      original_name: { type: graphql.GraphQLString },
      overview: { type: graphql.GraphQLString },
      origin_country: {type: new graphql.GraphQLList(graphql.GraphQLString)},
      poster_path: { type: graphql.GraphQLString },
      popularity: { type: graphql.GraphQLFloat },
      name: { type: graphql.GraphQLString },
      vote_average: { type: graphql.GraphQLFloat },
      vote_count: { type: graphql.GraphQLInt },
      media_type: { type: graphql.GraphQLString }
    }
});

const MovieType = new graphql.GraphQLObjectType({
    name: 'Movie',
    fields: {
        adult: { type: graphql.GraphQLBoolean },
        backdrop_path: { type: graphql.GraphQLString },
        genre_ids: {type: new graphql.GraphQLList(graphql.GraphQLInt)},
        id: { type: graphql.GraphQLInt },
        original_language: { type: graphql.GraphQLString },
        original_title: { type: graphql.GraphQLString },
        overview: { type: graphql.GraphQLString },
        origin_country: {type: new graphql.GraphQLList(graphql.GraphQLString)},
        release_date: { type: graphql.GraphQLString },
        poster_path: { type: graphql.GraphQLString },
        popularity: { type: graphql.GraphQLFloat },
        title: { type: graphql.GraphQLString },
        video: { type: graphql.GraphQLBoolean },
        vote_average: { type: graphql.GraphQLFloat },
        vote_count: { type: graphql.GraphQLInt },
        media_type: { type: graphql.GraphQLString }
    }
})

const multimediaType = new graphql.GraphQLUnionType({
    name: 'MultiMedia',
    types: [TvType, MovieType],
    resolveType(val) {
        const type = val.media_type === 'tv' ? TvType : MovieType;

        return type;
    }
})


const MultiQuery = new graphql.GraphQLObjectType({
    name: 'MultiQuery',
    fields: () => ({
        page: { type: graphql.GraphQLInt },
        results: {type: new graphql.GraphQLList(multimediaType)},
        total_pages: { type: graphql.GraphQLInt },
        total_results: { type: graphql.GraphQLInt }
    })
})


// Define the User type with two string fields: `id` and `name`.
// The type of User is GraphQLObjectType, which has child fields
// with their own types (in this case, GraphQLString).
// var userType = new graphql.GraphQLObjectType({
//   name: 'User',
//   fields: {
//     id: { type: graphql.GraphQLString },
//     name: { type: graphql.GraphQLString },
//   }
// });

// Define the schema with one top-level field, `user`, that
// takes an `id` argument and returns the User with that ID.
// Note that the `query` is a GraphQLObjectType, just like User.
// The `user` field, however, is a userType, which we defined above.
var schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
      multi: {
        type: MultiQuery,
        args: {
          name: { type: graphql.GraphQLString }
        },
        resolve: function (_, args) {
          return multiQuery(args.name)
        }
      }
    }
  })
});

const auth = (req, res, next) => {
    const token = req.get('X-Auth-Token');

    if (token && token === config.secret) { return next();}

    console.log(`Unauthorized. Token provided: ${token}`)
    res.status(401).end();
}

express()
  .use('/graphql', auth,  graphqlHTTP({ schema: schema, pretty: true }))
  .listen(3000);

console.log('GraphQL server running on http://localhost:3000/graphql');
