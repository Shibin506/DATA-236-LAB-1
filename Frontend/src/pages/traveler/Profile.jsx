import React, { useEffect, useState } from 'react'
import { userApi } from '../../services/api'

const countries = ['United States','Canada','United Kingdom','India','Australia']

export default function Profile() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', about:'', city:'', state:'', country:'United States', languages:'', gender:'' })
  const [avatar, setAvatar] = useState(null)
  const [currentAvatar, setCurrentAvatar] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    userApi.getProfile().then(({data}) => {
      const u = data.user || {}
      setForm({
        name: u.name||'', email: u.email||'', phone: u.phone||'', about: u.about_me||u.about||'', city: u.city||'', state: u.state||'', country: u.country||'United States', languages: u.languages||'', gender: u.gender||''
      })
      setCurrentAvatar(u.profile_picture || '')
    }).catch(()=>{})
  }, [])

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      await userApi.updateProfile(form)
      if (avatar) {
        const res = await userApi.uploadAvatar(avatar)
        const url = res?.data?.profile_picture
        if (url) setCurrentAvatar(url)
      }
      setMsg('Profile updated')
    } catch {
      setMsg('Update failed')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <h3 className="mb-3">Profile</h3>
        {msg && <div className="alert alert-info">{msg}</div>}

        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-12 d-flex align-items-center gap-3">
              {currentAvatar ? (
                <img src={currentAvatar} alt="avatar" style={{width:64,height:64,borderRadius:'50%',objectFit:'cover',border:'1px solid #ddd'}} />
              ) : (
                <div style={{width:64,height:64,borderRadius:'50%',background:'#f0f0f0',border:'1px solid #ddd'}} />
              )}
              {currentAvatar && (
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={async()=>{ try{ await userApi.deleteAvatar(); setCurrentAvatar('') }catch{} }}>Remove</button>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input className="form-control" name="name" value={form.name} onChange={onChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" name="email" type="email" value={form.email} onChange={onChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" name="phone" value={form.phone} onChange={onChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Languages</label>
              <input className="form-control" name="languages" value={form.languages} onChange={onChange} />
            </div>
            <div className="col-md-12">
              <label className="form-label">About me</label>
              <textarea className="form-control" name="about" rows="3" value={form.about} onChange={onChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">City</label>
              <input className="form-control" name="city" value={form.city} onChange={onChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">State (abbr)</label>
              <input className="form-control" name="state" value={form.state} onChange={onChange} placeholder="CA" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Country</label>
              <select className="form-select" name="country" value={form.country} onChange={onChange}>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Gender</label>
              <select className="form-select" name="gender" value={form.gender} onChange={onChange}>
                <option value="">Prefer not to say</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Profile picture</label>
              <input type="file" className="form-control" onChange={e=>setAvatar(e.target.files?.[0])} />
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-brand text-white">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
