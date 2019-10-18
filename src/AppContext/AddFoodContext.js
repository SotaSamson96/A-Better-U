import React, { Component } from 'react';
import {Key} from '../API/API_Key';
import Heart from '../assets/heart.svg';
import BlueHeart from '../assets/filled-in-heart.svg';

export const AddFoodContext = React.createContext();

export class AddFoodProvider extends Component {
  ResetSelections = () => {
    this.setState({
      FoodAdded: [],
      FoodSearch: [],
      showFavorite: false
    })
  }

  OnEnter = e => {
    let search = e.target.value;
    if(e.key === 'Enter' && search !== ''){
      e.preventDefault();
      let uri = encodeURI(`https://api.nal.usda.gov/ndb/search/?format=json&q=${search}&sort=r&offset=0&api_key=${Key}`)
      fetch(uri)
        .then(response => response.json())
        .then(data => {
          if (data.list === undefined){
            alert("We are unable to find the food you were searching for. Please enter another item!")
          }
          else{
            this.setState({
              FoodSearch: data.list.item
            }, function(){
              this.HeartColor(false)
            })
          }
        })
      }
    }

  GetFavorites = () => {
    let uri = '/user/getFavorites?favExercises=0';
    fetch(uri)
      .then(res => res.json())
      .then(data => {
        this.setState({
          FoodSearch: data.favFoods,
          showFavorite: true
        },function(){
          this.HeartColor(true)
        })
      })
      .catch(err => console.error(err))
  }

  AddFood = (name, ndbno, e) => {
    let checkbox = e.target.style;
    let newState;

    if (checkbox.backgroundColor === "" || checkbox.backgroundColor === "white"){
      checkbox.backgroundColor = '#1F0CAD';
      newState = [{"name": name, "ndbno": ndbno, "servings" : 1}];

      this.setState(previousState => ( {
        FoodAdded: previousState.FoodAdded.concat(newState)
      } ))
    }
    else {
      checkbox.backgroundColor = "white";
      newState = this.state.FoodAdded.filter((item) => {
        return item.name !== name
      })

      this.setState(previousState => ( {
        FoodAdded: newState,
      } ))

    }
  }

  FavoriteFood = (name, ndbno, e) => {
    let {FoodSearch, showFavorite} = this.state;
    let img = e.target;
    let operation;

    if(img.src.indexOf('filled-in-heart') === -1){
      img.src = BlueHeart;
      operation = 'insert';
    }
    else {
      if(showFavorite){
        let newState = FoodSearch.filter( item => {
          return item.name !== name || item.ndbno !== ndbno
        })
        this.setState({
          FoodSearch: newState
        })
      }
      img.src = Heart;
      operation = 'delete';
    }

    let uri = `/user/${operation}Favorites`;
    let method = operation === 'insert' ? 'POST' : 'PUT';
    let requestObject = {
      user: "1",
      item: { name, ndbno },
      field: "favFoods"
    }

    fetch(uri, {
      method,
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestObject)
    })
      .catch(err => console.error(err))
  }

  StoreFood = (nutritionDate, currentMeal) => {
    let {FoodAdded} = this.state;
    let options = {month: "2-digit", day: "2-digit", year: "numeric"};
    let date = nutritionDate.toLocaleDateString("en-US", options);

    let requestObject = {
      "date": date,
      "meal": currentMeal,
      "FoodAdded": FoodAdded
    }

    if(FoodAdded.length > 0 && currentMeal !== ""){
      fetch('/nutrition/insertFood', {
        method: 'POST',
        mode: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestObject)
      })
        .catch(err => console.log(err))
    }
  }

  HeartColor = (fill) => {
    let AddFoodFavorite = document.getElementsByClassName('AddFoodFavorite');
    [...AddFoodFavorite].forEach( item => {
      item.src = fill === true ? BlueHeart : Heart;
    })
  }

  state = {
    FoodAdded: [],
    FoodSearch: [],
    showFavorite: false
  }

  render() {
    const {state, ...methods} = this;
    return (
      <AddFoodContext.Provider value ={{...methods, ...state}}>
        {this.props.children}
      </AddFoodContext.Provider>
    );
  }

}