import { Button } from '@material-ui/core';
import React, {useContext, useEffect, useState} from 'react'
import { useSelector } from 'react-redux';
import { Link, useHistory, useParams } from 'react-router-dom'
import DepartmentCard from '../DepartmentCard';
import ModalDepart from './ModalDepart';
import CreatorContext from "../contexts/creatorContext";

const OrganizationInfo = ({ organizations }) => {
  console.log('RENDER OrgINFO');

  console.log(organizations);
  const { id } = useParams()
  const [org, setOrg] = useState({})
  const history = useHistory()
  const [open, setOpen] = React.useState(false);
  const { creator, setCreator } = useContext(CreatorContext); // CONTEXT

  const depArray = useSelector(state => state.departments[id]) || []
  console.log('depArray', depArray);

  useEffect(() => {

    const findOrg = organizations.find(el => el._id === id)
    console.log('FFFFFFFFFF', findOrg);
    if (findOrg) {
      setOrg({ ...findOrg })
    }

  }, [])

  const backHandler = () => {
    history.goBack()
  }

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {
      creator ?
        <>
        <div>Страница организации</div>
        { Object.keys(org).length ?
            <div className="d-flex flex-column align-items-center">
              <h1>
                {org.name}
              </h1>
              <p>Добавьте отделы/подразделения вашей компании </p>


              <Button variant="outlined" color="primary" onClick={handleClickOpen}>
                + Добавить отдел
              </Button>
              {open && <ModalDepart open={open} handleClose={handleClose} orgID={org._id} />}

              <div>
                {depArray.length ? <ul className="dep-list ">
                  {depArray.map((dep) => {
                    console.log('>>>>>>>>>>', dep);
                    return (
                      <Link to={`/department/${dep._id}`} key={dep._id}>
                        <li className="dep-list-task">
                          <DepartmentCard {...dep} />
                        </li>
                      </Link>
                    )
                  })}
                </ul> : <p>Нет добавленных отделов</p>
                }
              </div>


              <button onClick={backHandler} type="button" className="btn btn-primary mt-5">Back</button>

            </div>
            : null}
            </>
        : 'Вы как сюда попали?'
    }


    </>
  )
}

export default OrganizationInfo
