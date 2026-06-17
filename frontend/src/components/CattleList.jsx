import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CattleList = () => {
  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    breed: '',
    age: '',
    gender: 'Female',
    healthStatus: 'Healthy',
    weight: '',
  });

  const API_URL = '/api/cattle';

  const fetchCattle = async () => {
    try {
      const response = await axios.get(API_URL);
      setCattle(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching cattle');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCattle();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      setFormData({
        tagNumber: '',
        name: '',
        breed: '',
        age: '',
        gender: 'Female',
        healthStatus: 'Healthy',
        weight: '',
      });
      fetchCattle();
    } catch (err) {
      alert('Error adding cattle');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this cattle record?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchCattle();
      } catch (err) {
        alert('Error deleting cattle');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Cattle Management</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Add New Cattle</h3>
        <input name="tagNumber" placeholder="Tag Number" value={formData.tagNumber} onChange={handleChange} required /><br />
        <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required /><br />
        <input name="breed" placeholder="Breed" value={formData.breed} onChange={handleChange} required /><br />
        <input name="age" type="number" placeholder="Age" value={formData.age} onChange={handleChange} required /><br />
        <select name="gender" value={formData.gender} onChange={handleChange}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select><br />
        <input name="healthStatus" placeholder="Health Status" value={formData.healthStatus} onChange={handleChange} /><br />
        <input name="weight" type="number" placeholder="Weight" value={formData.weight} onChange={handleChange} /><br />
        <button type="submit">Add Cattle</button>
      </form>

      <h3>Cattle List</h3>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Tag #</th>
            <th>Name</th>
            <th>Breed</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cattle.map((c) => (
            <tr key={c._id}>
              <td>{c.tagNumber}</td>
              <td>{c.name}</td>
              <td>{c.breed}</td>
              <td>{c.age}</td>
              <td>{c.gender}</td>
              <td>{c.healthStatus}</td>
              <td>
                <button onClick={() => handleDelete(c._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CattleList;
